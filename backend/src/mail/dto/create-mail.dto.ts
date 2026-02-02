import {IsString, IsEmail} from 'class-validator';
export class CreateEmailUserDto{
    @IsString()
    name: string;

    @IsEmail()
    email: string;
}