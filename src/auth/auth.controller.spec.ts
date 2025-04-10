/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockJwtToken = 'mocked-jwt-token';

  const mockAuthService = {
    signUp: jest.fn().mockResolvedValue(mockJwtToken),
    login: jest.fn().mockResolvedValue(mockJwtToken),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authController = moduleRef.get<AuthController>(AuthController);
    authService = moduleRef.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('signUp', () => {
    it('should call AuthService.signUp and return a JWT token', async () => {
      const signUpDto: SignUpDto = {
        name: 'Ghulam',
        email: 'ghulam1@gmail.com',
        password: '12345678',
      };

      const result = await authController.signUp(signUpDto);
      expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
      expect(result).toEqual(mockJwtToken);
    });
  });

  describe('login', () => {
    it('should call AuthService.login and return a JWT token', async () => {
      const loginDto: LoginDto = {
        email: 'ghulam1@gmail.com',
        password: '12345678',
      };

      const result = await authController.login(loginDto);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockJwtToken);
    });
  });
});
