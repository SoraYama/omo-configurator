import i18n from "./index";

export type SupportedLanguage = "zh-CN" | "en-US";

export const supportedLanguages: { value: SupportedLanguage; label: string }[] =
  [
    { value: "zh-CN", label: "中文" },
    { value: "en-US", label: "English" },
  ];

export const changeLanguage = (lang: SupportedLanguage) => {
  return i18n.changeLanguage(lang);
};

export const getCurrentLanguage = (): SupportedLanguage => {
  const lang = i18n.language;
  if (lang === "zh-CN" || lang === "en-US") return lang;
  if (lang.startsWith("zh")) return "zh-CN";
  if (lang.startsWith("en")) return "en-US";
  return "zh-CN";
};
