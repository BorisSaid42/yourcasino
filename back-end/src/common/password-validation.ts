import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

interface PasswordValidationObject {
  password?: string;
  passwordRepeat?: string;
}

@ValidatorConstraint({ name: 'MatchPassword', async: false })
export class MatchPasswordConstraint implements ValidatorConstraintInterface {
  validate(passwordRepeat: string, args: ValidationArguments): boolean {
    const { password } = args.object as PasswordValidationObject;
    return passwordRepeat === password;
  }

  defaultMessage(): string {
    return 'Passwords do not match';
  }
}
