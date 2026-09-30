import "@testing-library/jest-dom/vitest";
import i18n from "@/i18n";

// 测试断言使用中文文案，固定语言避免受 jsdom navigator 影响
await i18n.changeLanguage("zh-CN");
