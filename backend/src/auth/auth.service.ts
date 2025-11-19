import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name, role } = registerDto;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      role: role || 'user',
    });

    const savedUser = await this.userRepository.save(user);

    // Générer le token JWT
    const payload = { email: savedUser.email, sub: savedUser.id };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Compte désactivé');
    }

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validateUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    return user;
  }

  async findAll(listUsersDto: any, currentUser?: User) {
    const { search, role, isActive, page = 1, limit = 10 } = listUsersDto;
    const query = this.userRepository.createQueryBuilder('user');

    // Si l'utilisateur actuel est un admin (mais pas super_admin),
    // il ne voit que les utilisateurs qu'il a créés
    if (currentUser && currentUser.role === 'admin') {
      query.where('user.createdById = :createdById', {
        createdById: currentUser.id,
      });
    }
    // Les super_admins voient tous les utilisateurs

    if (search) {
      const searchCondition =
        '(user.name LIKE :search OR user.email LIKE :search)';
      if (currentUser && currentUser.role === 'admin') {
        query.andWhere(searchCondition, { search: `%${search}%` });
      } else {
        query.where(searchCondition, { search: `%${search}%` });
      }
    }

    if (role) {
      query.andWhere('user.role = :role', { role });
    }

    if (isActive !== undefined) {
      query.andWhere('user.isActive = :isActive', { isActive });
    }

    const skip = (page - 1) * limit;
    const [users, total] = await query
      .skip(skip)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        createdById: user.createdById,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['locations'],
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async create(createUserDto: any, createdBy?: User) {
    // Seul super_admin peut créer des super_admin
    if (
      createUserDto.role === 'super_admin' &&
      createdBy?.role !== 'super_admin'
    ) {
      throw new Error('Seul un super admin peut créer un super admin');
    }

    // Admin peut créer user et admin, mais pas super_admin
    if (createUserDto.role === 'super_admin' && createdBy?.role === 'admin') {
      throw new Error('Un admin ne peut pas créer un super admin');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const userEntity = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || 'user',
      isActive:
        createUserDto.isActive !== undefined ? createUserDto.isActive : true,
      createdById: createdBy?.id || null, // Enregistrer qui a créé cet utilisateur
    });

    const savedUserResult = await this.userRepository.save(userEntity);
    const savedUser = Array.isArray(savedUserResult)
      ? savedUserResult[0]
      : savedUserResult;

    return {
      id: savedUser.id,
      email: savedUser.email,
      name: savedUser.name,
      role: savedUser.role,
      isActive: savedUser.isActive,
      createdAt: savedUser.createdAt,
      createdById: savedUser.createdById,
    };
  }

  async update(id: number, updateUserDto: any, updatedBy?: User) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Seul super_admin peut modifier un super_admin
    if (user.role === 'super_admin' && updatedBy?.role !== 'super_admin') {
      throw new Error('Seul un super admin peut modifier un super admin');
    }

    // Un admin ne peut pas modifier un super_admin
    if (user.role === 'super_admin' && updatedBy?.role === 'admin') {
      throw new Error('Un admin ne peut pas modifier un super admin');
    }

    // Seul super_admin peut promouvoir en super_admin
    if (
      updateUserDto.role === 'super_admin' &&
      updatedBy?.role !== 'super_admin'
    ) {
      throw new Error(
        'Seul un super admin peut promouvoir un utilisateur en super admin',
      );
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await this.userRepository.update(id, updateUserDto);

    return this.findOne(id);
  }

  async remove(id: number, deletedBy?: User) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Seul super_admin peut supprimer un super_admin
    if (user.role === 'super_admin' && deletedBy?.role !== 'super_admin') {
      throw new Error('Seul un super admin peut supprimer un super admin');
    }

    // Un admin ne peut pas supprimer un super_admin ou un autre admin
    if (
      (user.role === 'super_admin' || user.role === 'admin') &&
      deletedBy?.role === 'admin'
    ) {
      throw new Error('Un admin ne peut pas supprimer un admin ou super admin');
    }

    await this.userRepository.remove(user);
    return { message: 'Utilisateur supprimé avec succès' };
  }
}
