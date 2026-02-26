export class RegisterDto {
  email: string;
  password: string;
  role?: 'customer' | 'provider';
  companyName?: string;
  serviceCategory?: string;
}
