import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly svc: CertificatesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all certificates for the current user' })
  findAll(@CurrentUser() user: User) {
    return this.svc.findAllForUser(user.id);
  }

  @Get('verify/:code')
  @ApiOperation({ summary: 'Publicly verify a certificate by verification code' })
  verify(@Param('code') code: string) {
    return this.svc.verifyCertificate(code);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific certificate (with PDF link)' })
  getById(@Param('id') id: string) {
    return this.svc.getById(id);
  }
}
