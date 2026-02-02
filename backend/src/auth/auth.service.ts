import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as qs from 'qs';
import { JwtService } from '@nestjs/jwt';
import { Response, Request } from 'express';
import * as cookie from 'cookie';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './entities/Company.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
    private readonly traccarApiUrl = process.env.My_Ip;

    constructor(private readonly jwtService: JwtService,
        @InjectRepository(Company) private companyRepository: Repository<Company>,
    ) { }
    getDataFromCookie(req: Request): any {
        if (!req.headers.cookie) {
            throw new HttpException('No cookies found', HttpStatus.UNAUTHORIZED);
        }
        try {
            const cookies = cookie.parse(req.headers.cookie || '');
            const JWTtoken = cookies['token'] || null;
            if (!JWTtoken) {
                throw new HttpException('No session active', HttpStatus.UNAUTHORIZED);
            }
            const decodedPayload = this.jwtService.verify(JWTtoken, {
                secret: process.env.JWT_SECRET,
            });
            return decodedPayload;
        } catch (error) {
            console.error('Error al obtener los datos de la cookie:', error);
            throw new HttpException('Error al obtener los datos de la cookie', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    authHeader(username: string, password: string): string {
        const authHeader = 'Basic ' + btoa(`${username}:${password}`);

        return authHeader;
    }

    async getUserByEmail(email: string, password: string): Promise<any> {
        if (!email || !password) {
            throw new HttpException('You cannot send empty fields', HttpStatus.NOT_ACCEPTABLE);
        }
        try {
            const authHeader = this.authHeader(email, password);
            // Configurar los headers de autenticación
            const headers = {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            };
            // Realizar la solicitud GET a la API de Traccar para obtener los usuarios
            const response = await axios.get(`${this.traccarApiUrl}/api/users`, { headers });
            const users = response.data;
            // Buscar el usuario por email
            const user = users.find((user: any) => user.email === email);
            if (!user) {
                throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
            }
            return user;
        } catch (error) {
            console.error('Error al obtener el usuario por email:', error);
            throw new HttpException('Error al obtener el usuario', HttpStatus.INTERNAL_SERVER_ERROR);

        }
    }

    async findCompanyById(id: number) {
        return await this.companyRepository.findOne({ where: { idCompany: id } });
    }

    async findCompanyByUsername(companyName: string) {
        return await this.companyRepository.findOne({ where: { companyName } });
    }

    async login(email: string, password: string, res: Response): Promise<any> {
        if (!email || !password) {
            throw new HttpException('You cannot send empty fields', HttpStatus.NOT_ACCEPTABLE);
        }

        try {
            const data = qs.stringify({
                email: email,
                password: password,
            });
            // Autenticar con Traccar usando el endpoint /session

            const response = await axios.post(`${this.traccarApiUrl}/session`, data, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    withCredentials: true
                },
            });
            // Si la autenticación es exitosa, Traccar devuelve un token y los datos del usuario
            if (response.data && response.data.email) {
                const payload = {
                    idUser: response.data.id,
                    NameUser: response.data.name,
                    passwordUser: password,
                    emailUser: email,
                    admin: response.data.administrator,
                };
                const token = this.jwtService.sign(payload);
                const sessionCookie = response.headers['set-cookie']!.find((c) =>
                    c.startsWith('JSESSIONID='),
                );
                res.setHeader(
                    'Set-Cookie', [
                    cookie.serialize('token', token, {
                        httpOnly: true,
                        path: '/',
                        maxAge: 60 * 60, // 1 hora
                        sameSite: 'strict',
                        secure: false,
                    }),
                    sessionCookie, // Cookie de sesión de Traccar
                ]
                );
                return {
                    message: 'Autenticación exitosa',
                    user: response.data,
                    token: token, // Datos del usuario devueltos por Traccar
                    sessionCookie: sessionCookie, // Cookie de sesión de Traccar
                };

            } else {
                throw new HttpException('Credenciales inválidas', HttpStatus.BAD_REQUEST);
            }
        } catch (error) {
            console.error(
                'Error al autenticar con Traccar, inserte los datos correctos',
            );
            throw new HttpException('Credenciales inválidas', HttpStatus.BAD_REQUEST);
        }
    }

    async logout(req: Request, res: Response): Promise<any> {
        if (!req.headers.cookie) {
            throw new HttpException('No hay sesión activa', HttpStatus.UNAUTHORIZED);
        }
        try {
            const cookies = cookie.parse(req.headers.cookie || '');
            const JWTtoken = cookies['token'] || null;

            if (!JWTtoken) {
                throw new HttpException('No hay sesión activa', HttpStatus.UNAUTHORIZED);
            }

            this.jwtService.verify(JWTtoken, {
                secret: process.env.JWT_SECRET,
            });

            res.clearCookie('token', {
                path: '/',
                sameSite: 'strict',
                secure: false,
            });

            return {
                message: 'Sesión cerrada correctamente',
            };
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            throw new HttpException('Error al cerrar sesión', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
