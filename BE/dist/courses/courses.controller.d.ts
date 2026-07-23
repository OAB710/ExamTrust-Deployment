import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
export declare class CoursesController {
    private readonly coursesService;
    constructor(coursesService: CoursesService);
    create(createCourseDto: CreateCourseDto, req: any): Promise<any>;
    findAll(req: any, page?: string, limit?: string): Promise<any>;
    getMyCourses(req: any): Promise<any>;
    getMyRecentCourses(req: any): Promise<any>;
    findOne(id: string, req: any): Promise<any>;
    update(id: string, updateCourseDto: UpdateCourseDto, req: any): Promise<any>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
