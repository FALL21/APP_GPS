import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Location } from './entities/location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Récupère l'adresse à partir des coordonnées GPS (géocodage inverse)
   */
  private async getAddressFromCoordinates(
    latitude: number,
    longitude: number,
  ): Promise<string | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'GPS-Tracking-App/1.0', // Requis par Nominatim
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (data && data.address) {
        const address = data.address;
        // Construire une adresse lisible
        const parts: string[] = [];

        if (address.road) parts.push(address.road);
        if (address.house_number) parts.unshift(address.house_number);
        if (address.suburb || address.neighbourhood)
          parts.push(address.suburb || address.neighbourhood);
        if (address.city || address.town || address.village)
          parts.push(address.city || address.town || address.village);
        if (address.country) parts.push(address.country);

        return parts.length > 0 ? parts.join(', ') : data.display_name || null;
      }

      return data.display_name || null;
    } catch (error) {
      console.error('Erreur lors du géocodage inverse:', error);
      return null;
    }
  }

  async create(userId: number, createLocationDto: CreateLocationDto) {
    // Si l'adresse n'est pas fournie, essayer de la récupérer via géocodage inverse
    let address = createLocationDto.address;

    if (!address && createLocationDto.latitude && createLocationDto.longitude) {
      address = await this.getAddressFromCoordinates(
        createLocationDto.latitude,
        createLocationDto.longitude,
      );
    }

    const location = this.locationRepository.create({
      ...createLocationDto,
      address: address || null,
      userId,
    });

    return await this.locationRepository.save(location);
  }

  async findAll(userId?: number, currentUserRole?: string) {
    const query = this.locationRepository
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.user', 'user')
      .orderBy('location.timestamp', 'DESC');

    // Les admins peuvent voir toutes les positions, les users seulement les leurs
    if (
      userId &&
      currentUserRole !== 'admin' &&
      currentUserRole !== 'super_admin'
    ) {
      query.where('location.userId = :userId', { userId });
    } else if (
      userId &&
      (currentUserRole === 'admin' || currentUserRole === 'super_admin')
    ) {
      query.where('location.userId = :userId', { userId });
    } else if (
      !userId &&
      currentUserRole !== 'admin' &&
      currentUserRole !== 'super_admin'
    ) {
      // Un user sans userId spécifié ne peut voir que ses propres positions
      // Ce cas ne devrait pas arriver avec les guards en place
      return [];
    }

    return await query.getMany();
  }

  async findLatest(userId?: number) {
    const query = this.locationRepository
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.user', 'user')
      .orderBy('location.timestamp', 'DESC')
      .limit(1);

    if (userId) {
      query.where('location.userId = :userId', { userId });
    }

    return await query.getOne();
  }

  async findByUser(userId: number, limit: number = 100) {
    return await this.locationRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }

  async getUserActivity(currentUser?: User) {
    // Si l'utilisateur actuel est un admin (mais pas super_admin),
    // récupérer seulement les utilisateurs qu'il a créés
    let users: User[];
    if (currentUser && currentUser.role === 'admin') {
      users = await this.userRepository.find({
        where: { createdById: currentUser.id },
      });
    } else {
      // Les super_admins voient tous les utilisateurs
      users = await this.userRepository.find();
    }

    // Récupérer la dernière position pour chaque utilisateur
    const userActivity = [];
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes

    for (const user of users) {
      const latestLocation = await this.locationRepository.findOne({
        where: { userId: user.id },
        order: { timestamp: 'DESC' },
      });

      const isTracking = latestLocation
        ? new Date(latestLocation.timestamp) >= fiveMinutesAgo
        : false;

      const countResult = await this.locationRepository
        .createQueryBuilder('location')
        .where('location.userId = :userId', { userId: user.id })
        .getCount();

      userActivity.push({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        isTracking,
        lastUpdate: latestLocation?.timestamp ? latestLocation.timestamp.toISOString() : null,
        lastLocation: latestLocation
          ? {
              id: latestLocation.id,
              latitude: Number(latestLocation.latitude),
              longitude: Number(latestLocation.longitude),
              speed: latestLocation.speed ? Number(latestLocation.speed) : null,
              heading: latestLocation.heading ? Number(latestLocation.heading) : null,
              timestamp: latestLocation.timestamp ? latestLocation.timestamp.toISOString() : null,
              address: latestLocation.address || null,
            }
          : null,
        totalLocations: countResult,
      });
    }

    return userActivity;
  }

  /**
   * Récupère l'itinéraire d'un utilisateur sur une période donnée (24h, 48h, 72h)
   */
  async getUserRoute(
    userId: number,
    range: '24h' | '48h' | '72h',
    currentUser?: User,
  ): Promise<Location[]> {
    // Vérifier que l'utilisateur existe
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(
        `Utilisateur avec l'ID ${userId} introuvable`,
      );
    }

    // Pour les admins, vérifier qu'ils ont créé cet utilisateur
    if (
      currentUser &&
      currentUser.role === 'admin' &&
      user.createdById !== currentUser.id
    ) {
      throw new NotFoundException(
        `Vous n'avez pas la permission de voir l'itinéraire de cet utilisateur`,
      );
    }

    // Calculer la date de début selon la période
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '48h':
        startDate = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        break;
      case '72h':
        startDate = new Date(now.getTime() - 72 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Récupérer les locations dans la période
    return this.locationRepository.find({
      where: {
        userId: userId,
        timestamp: Between(startDate, now),
      },
      order: {
        timestamp: 'ASC',
      },
    });
  }
}
