export const translations = {
  en: {
    dashboard: "Command Center",
    scan: "Identity Radar",
    device: "Device Monitor",
    privacy: "Shadow Cleaner",
    signOut: "Sign Out",
    securityScore: "Security Score",
    totalScans: "Total Scans",
    breachesFound: "Breaches Found",
    platformsExposed: "Platforms Exposed",
    deletionsSent: "Deletions Sent",
    recentAlerts: "Recent Alerts",
    runScan: "Run Identity Scan",
    checkSIM: "Check SIM Integrity",
    cleanData: "Clean My Data",
    welcome: "Welcome back",
    noAlerts: "No alerts. Your digital perimeter is clear.",
    lastScan: "Last scan",
    noScans: "No scans run yet",
  },
  ar: {
    dashboard: "مركز القيادة",
    scan: "رادار الهوية",
    device: "مراقب الجهاز",
    privacy: "منظف الظل",
    signOut: "تسجيل الخروج",
    securityScore: "درجة الأمان",
    totalScans: "إجمالي الفحوصات",
    breachesFound: "الاختراقات المكتشفة",
    platformsExposed: "المنصات المكشوفة",
    deletionsSent: "طلبات الحذف",
    recentAlerts: "التنبيهات الأخيرة",
    runScan: "تشغيل فحص الهوية",
    checkSIM: "فحص سلامة الشريحة",
    cleanData: "تنظيف بياناتي",
    welcome: "مرحباً بعودتك",
    noAlerts: "لا تنبيهات. محيطك الرقمي آمن.",
    lastScan: "آخر فحص",
    noScans: "لم يتم إجراء فحوصات بعد",
  },
};

export type Lang = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

export function t(key: TranslationKey, lang: Lang): string {
  return translations[lang][key] ?? translations.en[key];
}
