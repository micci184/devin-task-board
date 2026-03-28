import { z } from "zod";

export const signupSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスは必須です")
    .email("メールアドレスの形式が正しくありません"),
  name: z.string().min(1, "名前は必須です").max(255, "名前は255文字以内で入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスは必須です")
    .email("メールアドレスの形式が正しくありません"),
  password: z.string().min(1, "パスワードは必須です"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
