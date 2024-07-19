import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default [
	js.configs.recommended,
	...tseslint.configs.strictTypeChecked,
	...tseslint.configs.stylisticTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				project: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		files: ["**/*.js"],
		...tseslint.configs.disableTypeChecked,
	},
	{
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
];
