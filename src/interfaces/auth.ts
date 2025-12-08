export interface ILoginSchema {
  email: string;
  password: string;
}

export interface IForgetPasswordRequestSchema {
  email: string;
}

export interface IForgetPasswordSchema {
  email: string;
  token: string;
  password: string;
}
