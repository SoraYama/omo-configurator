import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supportedLanguages, type SupportedLanguage } from "@/i18n/utils";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const raw = i18n.language;
  let currentLang: SupportedLanguage = "zh-CN";
  if (raw === "zh-CN" || raw === "en-US") {
    currentLang = raw;
  } else if (raw.startsWith("en")) {
    currentLang = "en-US";
  }

  const handleChange = (value: SupportedLanguage) => {
    void i18n.changeLanguage(value);
  };

  return (
    <Select value={currentLang} onValueChange={handleChange}>
      <SelectTrigger className="w-[90px] h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {supportedLanguages.map((lang) => (
          <SelectItem key={lang.value} value={lang.value} className="text-xs">
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
