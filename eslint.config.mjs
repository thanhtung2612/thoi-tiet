export default [
  {
    files: ["**/*.ts", "**/*.tsx"], // Áp dụng cho TypeScript
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Bỏ qua lỗi any
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }], // Chỉ cảnh báo biến không dùng, bỏ qua biến bắt đầu bằng _
      "react-hooks/exhaustive-deps": "off", // Bỏ qua cảnh báo thiếu dependency trong useEffect
    },
  },
];
