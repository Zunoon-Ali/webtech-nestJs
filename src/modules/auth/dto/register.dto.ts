import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../shared-types';

export class RegisterDto {
  @ApiProperty({ example: 'jane.doe@nexara.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.EMPLOYEE })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: 'uuid-of-team' })
  @IsUUID()
  @IsOptional()
  teamId?: string;

  @ApiProperty({ example: 'uuid-of-company' })
  @IsUUID()
  companyId: string;
}
