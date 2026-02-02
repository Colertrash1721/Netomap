import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class GeofenceService {
    constructor(
        private readonly authService: AuthService,
    ) {}
    private readonly traccarApiUrl = process.env.My_Ip;
    private readonly traccarUser = process.env.TRACCAR_USER;
    private readonly traccarPass = process.env.TRACCAR_PASS;
    
    private buildAuthHeaders(email: string, password: string) {
        return {
            Authorization: this.authService.authHeader(email, password),
            'Content-Type': 'application/json',
        };
    }
    
    // Obtener geofensas de traccar
    async getGeofences(){
        try {
            const headers = this.buildAuthHeaders(this.traccarUser!, this.traccarPass!)
            const response = await axios.get(`${this.traccarApiUrl}/geofences`, { headers });
            return response.data;
        } catch (error) {
            throw new HttpException('Error obteniendo todos los dispositivos', HttpStatus.UNAUTHORIZED);
        }
    }
}
