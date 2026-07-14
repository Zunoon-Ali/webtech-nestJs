import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Risk & Compliance' })
  @IsString() @IsNotEmpty()
  name: string;
}

export class CreateTeamDto {
  @ApiProperty({ example: 'AML Operations' })
  @IsString() @IsNotEmpty()
  name: string;
}
