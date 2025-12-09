// app/layout.jsx
import "../styles/globals.css";

export const metadata = {
  title: "句子练习系统",
  description: "拼句 / 填空 / 听写 练习小工具"
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head />
      <body>{children}</body>
    </html>
  );
}
