import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { AuthService } from './auth.service';
import { User } from './schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let model: Model<User>;
  let jwtService: JwtService;

  const mockUser = {
    _id: '61c0ccf11d7bf83d153d7c06',
    name: 'Ghulam',
    email: 'ghulam1@gmail.com',
    password: 'hashedPassword',
    __v: 0,
  } as unknown as Document<unknown, object, User> & User;

  const token = 'jwtToken';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: getModelToken(User.name),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    model = module.get<Model<User>>(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('signUp', () => {
    const signUpDto = {
      name: 'Ghulam',
      email: 'ghulam1@gmail.com',
      password: '12345678',
    };

    it('should register the new user', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);

      jest.spyOn(model, 'create').mockResolvedValueOnce([mockUser] as any);

      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = await authService.signUp(signUpDto);

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(result).toEqual({ token });
    });

    it('should throw duplicate email entered', async () => {
      // Mock the create method to throw a MongoDB duplicate key error
      jest.spyOn(model, 'create').mockRejectedValueOnce({
        code: 11000,
        keyPattern: { email: 1 },
        keyValue: { email: signUpDto.email },
      });

      // Use try-catch to verify the exception
      try {
        await authService.signUp(signUpDto);
        fail('Expected ConflictException to be thrown');
      } catch (error) {
        if (error instanceof Error) {
          expect(error).toBeInstanceOf(ConflictException);
          expect(error.message).toBe('Duplicate email entered');
        }
      }
    });

    it('should throw ConflictException for duplicate email', async () => {
      jest.spyOn(model, 'create').mockImplementationOnce(() => {
        throw new ConflictException('Duplicate email');
      });

      await expect(authService.signUp(signUpDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('logIn', () => {
    const loginDto = {
      email: 'ghulam1@gmail.com',
      password: '12345678',
    };

    it('should login user and return the token', async () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = await authService.login(loginDto);

      expect(result).toEqual({ token });
    });

    it('should throw invalid email error', () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);

      return expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw invalid password error', () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false as never);

      return expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
