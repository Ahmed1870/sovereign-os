"""
Sovereign OS - Client-Side AES-256 Encryption Layer
Zero-Knowledge design: server never sees plaintext sensitive data.
Encryption key is derived from user's password, never stored server-side.
"""
import base64
import os
import hashlib
import hmac
from typing import Optional, Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from cryptography.exceptions import InvalidTag
import structlog

logger = structlog.get_logger()


class EncryptionError(Exception):
    """Raised when encryption/decryption fails."""
    pass


class ZeroKnowledgeCrypto:
    """
    AES-256-GCM encryption with PBKDF2 key derivation.
    
    Zero-Knowledge Architecture:
    - User's encryption key is derived from their password
    - Server NEVER sees the plaintext key or data
    - Each field encrypted with unique nonce
    - Authentication tag prevents tampering
    """
    
    SALT_SIZE = 32      # 256-bit salt
    NONCE_SIZE = 12     # 96-bit nonce (GCM standard)
    KEY_SIZE = 32       # 256-bit key
    ITERATIONS = 310_000  # OWASP recommended for PBKDF2-SHA256
    
    def __init__(self, master_key: Optional[bytes] = None):
        """
        Initialize with a master key (bytes).
        If not provided, will require per-operation key derivation.
        """
        self._master_key = master_key
    
    @classmethod
    def derive_key_from_password(
        cls,
        password: str,
        salt: Optional[bytes] = None,
        iterations: int = None,
    ) -> Tuple[bytes, bytes]:
        """
        Derive AES-256 key from user password using PBKDF2-SHA256.
        Returns (key, salt) - salt must be stored alongside encrypted data.
        """
        if salt is None:
            salt = os.urandom(cls.SALT_SIZE)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=cls.KEY_SIZE,
            salt=salt,
            iterations=iterations or cls.ITERATIONS,
            backend=default_backend(),
        )
        key = kdf.derive(password.encode("utf-8"))
        return key, salt
    
    @classmethod
    def from_password(cls, password: str, salt: Optional[bytes] = None):
        """Create instance with password-derived key."""
        key, salt = cls.derive_key_from_password(password, salt)
        instance = cls(master_key=key)
        instance._salt = salt
        return instance, salt
    
    def encrypt(self, plaintext: str, associated_data: Optional[bytes] = None) -> str:
        """
        Encrypt plaintext string with AES-256-GCM.
        Returns base64-encoded: nonce + ciphertext + tag
        
        associated_data: Additional authenticated data (not encrypted, but authenticated)
                        Use user_id to bind encryption to specific user.
        """
        if not self._master_key:
            raise EncryptionError("No encryption key available")
        
        nonce = os.urandom(self.NONCE_SIZE)
        aesgcm = AESGCM(self._master_key)
        
        try:
            ciphertext_with_tag = aesgcm.encrypt(
                nonce,
                plaintext.encode("utf-8"),
                associated_data,
            )
        except Exception as e:
            logger.error("encryption_failed", error=str(e))
            raise EncryptionError("Encryption failed") from e
        
        # Combine: nonce (12 bytes) + ciphertext+tag
        combined = nonce + ciphertext_with_tag
        return base64.b64encode(combined).decode("ascii")
    
    def decrypt(self, encrypted_b64: str, associated_data: Optional[bytes] = None) -> str:
        """
        Decrypt AES-256-GCM encrypted string.
        Raises EncryptionError if authentication fails (tampering detected).
        """
        if not self._master_key:
            raise EncryptionError("No encryption key available")
        
        try:
            combined = base64.b64decode(encrypted_b64)
        except Exception:
            raise EncryptionError("Invalid encrypted data format")
        
        if len(combined) < self.NONCE_SIZE + 16:  # 16 = GCM tag size
            raise EncryptionError("Encrypted data too short")
        
        nonce = combined[:self.NONCE_SIZE]
        ciphertext_with_tag = combined[self.NONCE_SIZE:]
        
        aesgcm = AESGCM(self._master_key)
        
        try:
            plaintext_bytes = aesgcm.decrypt(nonce, ciphertext_with_tag, associated_data)
        except InvalidTag:
            logger.warning("decryption_auth_failed", hint="possible_tampering")
            raise EncryptionError("Authentication failed - data may have been tampered with")
        except Exception as e:
            logger.error("decryption_failed", error=str(e))
            raise EncryptionError("Decryption failed") from e
        
        return plaintext_bytes.decode("utf-8")
    
    @staticmethod
    def generate_master_key() -> str:
        """Generate a cryptographically secure 256-bit key (base64 encoded)."""
        return base64.b64encode(os.urandom(32)).decode("ascii")
    
    @staticmethod
    def compute_hmac(data: str, key: bytes) -> str:
        """Compute HMAC-SHA256 for data integrity verification."""
        return hmac.new(key, data.encode("utf-8"), hashlib.sha256).hexdigest()
    
    @staticmethod
    def secure_compare(a: str, b: str) -> bool:
        """Timing-safe string comparison to prevent timing attacks."""
        return hmac.compare_digest(a.encode("utf-8"), b.encode("utf-8"))


class FieldEncryptor:
    """
    Field-level encryption for database storage.
    Each sensitive DB field is individually encrypted.
    """
    
    def __init__(self, server_key_b64: str):
        """
        server_key_b64: Base64-encoded 32-byte server-side encryption key
        This key encrypts metadata, NOT user content (which uses user-derived keys).
        """
        try:
            key_bytes = base64.b64decode(server_key_b64)
            if len(key_bytes) != 32:
                raise ValueError("Key must be exactly 32 bytes")
            self._crypto = ZeroKnowledgeCrypto(master_key=key_bytes)
        except Exception as e:
            raise EncryptionError(f"Invalid server key: {e}") from e
    
    def encrypt_field(self, value: str, user_id: str) -> str:
        """Encrypt a database field, binding it to the user_id."""
        associated_data = user_id.encode("utf-8")
        return self._crypto.encrypt(value, associated_data)
    
    def decrypt_field(self, encrypted_value: str, user_id: str) -> str:
        """Decrypt a database field, verifying user_id binding."""
        associated_data = user_id.encode("utf-8")
        return self._crypto.decrypt(encrypted_value, associated_data)
    
    def encrypt_dict(self, data: dict, user_id: str, fields: list) -> dict:
        """Encrypt specified fields in a dictionary."""
        result = data.copy()
        for field in fields:
            if field in result and result[field] is not None:
                result[field] = self.encrypt_field(str(result[field]), user_id)
        return result
    
    def decrypt_dict(self, data: dict, user_id: str, fields: list) -> dict:
        """Decrypt specified fields in a dictionary."""
        result = data.copy()
        for field in fields:
            if field in result and result[field] is not None:
                try:
                    result[field] = self.decrypt_field(str(result[field]), user_id)
                except EncryptionError:
                    result[field] = "[DECRYPTION_FAILED]"
        return result
