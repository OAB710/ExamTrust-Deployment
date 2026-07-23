import { CourseTerm } from './course-term.enum';
export declare class CreateCourseDto {
    name: string;
    description?: string;
    credits?: number;
    academicYear: string;
    term: CourseTerm;
    lecturerId?: string;
}
