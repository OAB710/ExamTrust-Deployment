import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto, DeleteProfileDto, UpdateProfileDto } from './dto/update-profile.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: any;
            email: any;
            fullName: any;
            role: any;
            studentId: any;
            department: any;
            avatar: any;
        };
    }>;
    register(registerDto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: any;
            email: any;
            fullName: any;
            role: any;
            studentId: any;
            department: any;
        };
    }>;
    getProfile(req: any): Promise<any>;
    updateProfile(req: any, updateProfileDto: UpdateProfileDto): Promise<any>;
    changePassword(req: any, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    deleteProfile(req: any, deleteProfileDto: DeleteProfileDto): Promise<{
        message: string;
    }>;
}
