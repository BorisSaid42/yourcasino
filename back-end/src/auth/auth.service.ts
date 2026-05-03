import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { VerificationService } from 'src/verification/verification.service';
import { ServiceError } from '../common/service.error';
import { ConfigService } from '../config/config.service';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { PASSWORD_REGEX, PASSWORD_VALIDATION_MESSAGE } from './constants/password-validation';
import { ChangeForgottenPasswordDTO } from './dto/change-forgotten-password.dto';
import { Credentials, JWTCredentialsDTO } from './dto/jwt-credentials.dto';
import { LoginDTO } from './dto/login-request.dto';
import { SignupDTO } from './dto/signup-request.dto';
import { CodeVerificationType } from './dto/verification.dto';
import { JWTService } from './jwt/jwt.service';
import { ChangeUsernameDto } from './dto/change-username.dto';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly jwtService: JWTService,
    private readonly userService: UserService,
    private readonly verificationService: VerificationService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client({
      client_id: this.configService.getGoogleClientId(),
      client_secret: this.configService.getGoogleClientSecret(),
      redirectUri: this.configService.getGoogleCallbackUrl(),
    });
  }

  public async signup(payload: SignupDTO): Promise<Credentials> {
    const existingUser = await this.userService.findByEmailOrUsername(payload.email, payload.username);
    if (existingUser) {
      if (existingUser.email === payload.email) {
        throw new ServiceError('User with this email already exists');
      } else {
        throw new ServiceError('User with this username already exists');
      }
    }

    let user: User;
    try {
      user = await this.userService.createUser(payload);
    } catch (e) {
      console.error(e);
      throw new ServiceError('Could not signup user with given data');
    }

    try {
      await this.verificationService.requestEmailVerification(user.id, user.email);
    } catch (e) {
      console.error('Failed to send verification email:', e);
    }

    return {
      user: user.id,
      balance: user.balance,
      state: 'EMAIL_VERIFICATION_REQUIRED',
    };
  }

  public async login(body: LoginDTO): Promise<Credentials> {
    const { usernameOrEmail, password } = body;

    const user = await this.userService.findByEmailOrUsername(usernameOrEmail, usernameOrEmail);
    if (!user) {
      throw new ServiceError('The credentials you entered are invalid.');
    }

    if (!user.password) {
      throw new ServiceError('This account uses Google login. Please log in with Google.');
    }

    const isPasswordValid = await this.userService.checkPassword(password, user.password);
    if (!isPasswordValid) {
      throw new ServiceError('The credentials you entered are invalid.');
    }

    if (!user.emailVerifiedAt) {
      const hasVerificationCode = await this.verificationService.hasExistingVerificationCode(user.id);

      if (!hasVerificationCode) {
        try {
          await this.verificationService.requestEmailVerification(user.id, user.email);
          console.log(`Verification email sent to legacy user: ${user.email}`);
        } catch (e) {
          console.error(`Failed to send verification email to legacy user ${user.email}:`, e);
        }
      }

      throw new ServiceError('Please verify your email before logging in.');
    }

    return {
      user: user.id,
      balance: Number(user.balance),
      state: 'LOGGED_IN',
    };
  }

  async loginWithGoogle(code: string) {
    const { tokens } = await this.googleClient.getToken({
      code,
      redirect_uri: this.configService.getGoogleCallbackUrl(),
    });

    const idToken = tokens.id_token;
    if (!idToken) throw new ServiceError('No ID token received');

    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: this.configService.getGoogleClientId(),
    });

    const payload = ticket.getPayload();
    if (!payload?.email) throw new ServiceError('Google login: No email');

    let user = await this.userService.findByGoogleId(payload.sub);
    if (!user) {
      const existingUser = await this.userService.findByEmailOrUsername(payload.email, payload.email);

      if (existingUser) {
        user = await this.userService.updateGoogleId(existingUser.id, payload);
      } else {
        user = await this.userService.createGoogleUser({
          email: payload.email,
          username: payload.email.split('@')[0],
          emailVerified: !!payload.email_verified,
          displayName: payload.name,
          tos: true,
          googleId: payload.sub,
        });
      }
    }

    const credentials: Credentials = {
      user: user.id,
      balance: Number(user.balance),
      state: 'LOGGED_IN',
    };

    return this.signJWTCredentials(credentials);
  }

  public signJWTCredentials(payload: Credentials): JWTCredentialsDTO {
    return new JWTCredentialsDTO({
      ...payload,
      jwt: this.jwtService.jwt.sign(payload),
    });
  }

  public async requestForgetPasswordLink(email: string): Promise<void> {
    const user = await this.userService.findByEmailOrUsername(email, email);
    if (!user) {
      return;
    }

    await this.verificationService.requestForgetPasswordLink(user.id, email);
  }

  public async changeForgotenPassword(forgotenPassword: ChangeForgottenPasswordDTO): Promise<boolean> {
    if (!PASSWORD_REGEX.test(forgotenPassword.password)) {
      throw new HttpException(PASSWORD_VALIDATION_MESSAGE, HttpStatus.BAD_REQUEST);
    }

    await this.verificationService.verify(
      { code: forgotenPassword.code, userId: forgotenPassword.userId },
      CodeVerificationType.RESET_PASSWORD,
    );

    return this.userService.changePassword(forgotenPassword.userId, forgotenPassword.password);
  }

  public async changeUsername(payload: ChangeUsernameDto, userId: string): Promise<boolean> {
    const { newUsername: username } = payload;

    const existingUser = await this.userService.findByEmailOrUsername(username, username);
    if (existingUser && existingUser.id !== userId) {
      throw new HttpException('Username is already taken', HttpStatus.CONFLICT);
    }

    return this.userService.changeUsername(username, userId);
  }

  public async verifyEmail(userId: string, code: string): Promise<Credentials> {
    await this.verificationService.verify({ code, userId }, CodeVerificationType.REGISTER);

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new ServiceError('User not found');
    }

    await this.userService.markEmailAsVerified(userId);

    return {
      user: user.id,
      balance: Number(user.balance),
      state: 'LOGGED_IN',
    };
  }

  public async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new ServiceError('User not found');
    }

    if (user.emailVerifiedAt) {
      throw new ServiceError('Email is already verified');
    }

    await this.verificationService.requestEmailVerification(user.id, user.email);
  }
}
