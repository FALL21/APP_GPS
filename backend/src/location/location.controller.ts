import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthService } from '../auth/auth.service';
import { LocationGateway } from './location.gateway';

@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationController {
  constructor(
    private readonly locationService: LocationService,
    private readonly authService: AuthService,
    private readonly locationGateway: LocationGateway,
  ) {}

  @Post()
  async create(@Request() req, @Body() body: CreateLocationDto | CreateLocationDto[]) {
    const userId = req.user.userId;
    
    // Gérer à la fois un objet unique et un tableau (batch)
    const locations = Array.isArray(body) ? body : [body];
    console.log(`[Location] POST /locations - User ${userId} - ${locations.length} location(s)`);
    
    const savedLocations = [];
    for (const createLocationDto of locations) {
      const location = await this.locationService.create(
        userId,
        createLocationDto,
      );
      savedLocations.push(location);
      
      // Diffuser chaque position aux dashboards via WebSocket
      this.locationGateway.broadcastLocation(userId, location);
    }
    
    console.log(`[Location] Saved and broadcasted ${savedLocations.length} location(s) for user ${userId}`);
    
    // Retourner un objet unique si une seule position, sinon un tableau
    return Array.isArray(body) ? savedLocations : savedLocations[0];
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'user')
  findAll(@Request() req, @Query('userId') userId?: string) {
    const targetUserId = userId ? parseInt(userId) : req.user.userId;
    const userRole = req.user.role;
    // Seuls les admins peuvent voir les positions des autres
    if (userId && userRole !== 'admin' && userRole !== 'super_admin') {
      return [];
    }
    return this.locationService.findAll(targetUserId, userRole);
  }

  @Get('latest')
  findLatest(@Request() req, @Query('userId') userId?: string) {
    const targetUserId = userId ? parseInt(userId) : req.user.userId;
    return this.locationService.findLatest(targetUserId);
  }

  @Get('history')
  findHistory(
    @Request() req,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
  ) {
    const targetUserId = userId ? parseInt(userId) : req.user.userId;
    const limitNum = limit ? parseInt(limit) : 100;
    return this.locationService.findByUser(targetUserId, limitNum);
  }

  @Get('activity')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  async getActivity(@Request() req) {
    // Récupérer l'utilisateur complet depuis la base de données
    const currentUser = await this.authService.validateUser(req.user.userId);
    return this.locationService.getUserActivity(currentUser);
  }

  @Get('route')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  async getUserRoute(
    @Request() req,
    @Query('userId') userId: string,
    @Query('range') range: '24h' | '48h' | '72h' = '24h',
  ) {
    if (!userId) {
      return [];
    }
    const currentUser = await this.authService.validateUser(req.user.userId);
    try {
      return await this.locationService.getUserRoute(
        parseInt(userId),
        range,
        currentUser,
      );
    } catch (error) {
      throw error;
    }
  }
}
