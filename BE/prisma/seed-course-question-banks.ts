import { PrismaClient, QuestionLifecycleStatus } from '@prisma/client';

const prisma = new PrismaClient();

type Fact = { term: string; definition: string; distractors: string[] };
type CourseBank = { code: string; topic: string; facts: Fact[] };

// One hundred questions are derived for every section below. The two repeated subjects
// intentionally receive the same subject-specific bank in their own course.
const banks: CourseBank[] = [
  { code: 'DATNUO-LECT-01', topic: 'Đất nước Việt Nam', facts: [
    { term: 'Cách mạng Tháng Tám', definition: 'cuộc cách mạng giành chính quyền năm 1945', distractors: ['cuộc cải cách kinh tế năm 1986', 'hiệp định về biên giới năm 1954', 'chương trình công nghiệp hóa năm 2000'] },
    { term: 'Ngày Quốc khánh Việt Nam', definition: 'ngày 2 tháng 9 năm 1945', distractors: ['ngày 30 tháng 4 năm 1975', 'ngày 19 tháng 8 năm 1945', 'ngày 2 tháng 7 năm 1976'] },
    { term: 'chủ quyền quốc gia', definition: 'quyền tối cao của quốc gia trong phạm vi lãnh thổ và độc lập trong quan hệ quốc tế', distractors: ['quyền của một doanh nghiệp', 'quyền sở hữu tư nhân', 'một loại thuế'] },
    { term: 'Đổi mới', definition: 'đường lối đổi mới toàn diện được khởi xướng từ năm 1986', distractors: ['chính sách thuộc địa', 'một cuộc chiến tranh', 'một triều đại phong kiến'] },
    { term: 'biển Đông', definition: 'vùng biển có ý nghĩa chiến lược về kinh tế, quốc phòng và giao thương', distractors: ['một con sông nội địa', 'một tỉnh miền núi', 'một loại hình giao thông'] },
  ] },
  { code: 'DATNUO-LECT-02', topic: 'Đất nước Việt Nam', facts: [
    { term: 'Cách mạng Tháng Tám', definition: 'cuộc cách mạng giành chính quyền năm 1945', distractors: ['cuộc cải cách kinh tế năm 1986', 'hiệp định về biên giới năm 1954', 'chương trình công nghiệp hóa năm 2000'] },
    { term: 'Ngày Quốc khánh Việt Nam', definition: 'ngày 2 tháng 9 năm 1945', distractors: ['ngày 30 tháng 4 năm 1975', 'ngày 19 tháng 8 năm 1945', 'ngày 2 tháng 7 năm 1976'] },
    { term: 'chủ quyền quốc gia', definition: 'quyền tối cao của quốc gia trong phạm vi lãnh thổ và độc lập trong quan hệ quốc tế', distractors: ['quyền của một doanh nghiệp', 'quyền sở hữu tư nhân', 'một loại thuế'] },
    { term: 'Đổi mới', definition: 'đường lối đổi mới toàn diện được khởi xướng từ năm 1986', distractors: ['chính sách thuộc địa', 'một cuộc chiến tranh', 'một triều đại phong kiến'] },
    { term: 'biển Đông', definition: 'vùng biển có ý nghĩa chiến lược về kinh tế, quốc phòng và giao thương', distractors: ['một con sông nội địa', 'một tỉnh miền núi', 'một loại hình giao thông'] },
  ] },
  { code: 'CLS002', topic: 'Lập trình Web', facts: [
    { term: 'HTML', definition: 'ngôn ngữ đánh dấu dùng để cấu trúc nội dung trang web', distractors: ['ngôn ngữ truy vấn cơ sở dữ liệu', 'hệ điều hành', 'giao thức mạng'] }, { term: 'CSS', definition: 'ngôn ngữ dùng để trình bày và định dạng giao diện web', distractors: ['máy chủ web', 'hệ quản trị cơ sở dữ liệu', 'trình biên dịch'] }, { term: 'HTTP', definition: 'giao thức trao đổi dữ liệu giữa trình duyệt và máy chủ web', distractors: ['ngôn ngữ lập trình', 'thiết bị mạng', 'hệ điều hành'] }, { term: 'REST API', definition: 'giao diện lập trình ứng dụng dựa trên tài nguyên và các phương thức HTTP', distractors: ['một kiểu bảng dữ liệu', 'một trình duyệt', 'một hệ điều hành'] }, { term: 'JavaScript', definition: 'ngôn ngữ lập trình phổ biến để tạo tương tác phía trình duyệt', distractors: ['ngôn ngữ đánh dấu', 'giao thức thư điện tử', 'cơ sở dữ liệu quan hệ'] },
  ] },
  { code: 'CLS003', topic: 'Lập trình Web', facts: [
    { term: 'HTML', definition: 'ngôn ngữ đánh dấu dùng để cấu trúc nội dung trang web', distractors: ['ngôn ngữ truy vấn cơ sở dữ liệu', 'hệ điều hành', 'giao thức mạng'] }, { term: 'CSS', definition: 'ngôn ngữ dùng để trình bày và định dạng giao diện web', distractors: ['máy chủ web', 'hệ quản trị cơ sở dữ liệu', 'trình biên dịch'] }, { term: 'HTTP', definition: 'giao thức trao đổi dữ liệu giữa trình duyệt và máy chủ web', distractors: ['ngôn ngữ lập trình', 'thiết bị mạng', 'hệ điều hành'] }, { term: 'REST API', definition: 'giao diện lập trình ứng dụng dựa trên tài nguyên và các phương thức HTTP', distractors: ['một kiểu bảng dữ liệu', 'một trình duyệt', 'một hệ điều hành'] }, { term: 'JavaScript', definition: 'ngôn ngữ lập trình phổ biến để tạo tương tác phía trình duyệt', distractors: ['ngôn ngữ đánh dấu', 'giao thức thư điện tử', 'cơ sở dữ liệu quan hệ'] },
  ] },
  { code: 'CLS004', topic: 'Lập trình hướng đối tượng', facts: [
    { term: 'đóng gói', definition: 'che giấu dữ liệu nội bộ và kiểm soát truy cập qua phương thức', distractors: ['sao chép toàn bộ mã', 'xóa dữ liệu', 'chạy song song'] }, { term: 'kế thừa', definition: 'cho phép lớp con nhận thuộc tính và hành vi của lớp cha', distractors: ['mã hóa dữ liệu', 'sắp xếp mảng', 'kết nối mạng'] }, { term: 'đa hình', definition: 'cho phép cùng một giao diện có các cách cài đặt khác nhau', distractors: ['tạo cơ sở dữ liệu', 'nén tệp', 'cấp phát mạng'] }, { term: 'lớp', definition: 'bản thiết kế dùng để tạo đối tượng', distractors: ['một đối tượng đã tạo', 'một kiểu lỗi', 'một giao thức'] }, { term: 'đối tượng', definition: 'thực thể được tạo từ lớp với trạng thái và hành vi', distractors: ['tên của gói phần mềm', 'một bảng SQL', 'một địa chỉ IP'] },
  ] },
  { code: 'CLS005', topic: 'Nhập môn lập trình', facts: [
    { term: 'biến', definition: 'vùng nhớ có tên dùng để lưu trữ giá trị có thể thay đổi', distractors: ['một lỗi cú pháp', 'một thiết bị mạng', 'một hệ điều hành'] }, { term: 'câu lệnh điều kiện', definition: 'cấu trúc chọn nhánh thực thi theo điều kiện đúng hoặc sai', distractors: ['cấu trúc lưu tệp', 'giao thức web', 'hàm băm'] }, { term: 'vòng lặp', definition: 'cấu trúc lặp lại một khối lệnh theo điều kiện hoặc số lần', distractors: ['một kiểu dữ liệu', 'một máy chủ', 'một cơ sở dữ liệu'] }, { term: 'hàm', definition: 'khối lệnh có tên thực hiện một nhiệm vụ xác định', distractors: ['một bảng tính', 'một trình duyệt', 'một địa chỉ IP'] }, { term: 'thuật toán', definition: 'dãy hữu hạn các bước rõ ràng để giải quyết bài toán', distractors: ['một ngôn ngữ đánh dấu', 'một thiết bị nhập', 'một loại tệp'] },
  ] },
  { code: 'CLS006', topic: 'Cấu trúc dữ liệu và giải thuật', facts: [
    { term: 'ngăn xếp', definition: 'cấu trúc dữ liệu hoạt động theo nguyên tắc vào sau ra trước', distractors: ['vào trước ra trước', 'truy cập ngẫu nhiên duy nhất', 'không có thứ tự'] }, { term: 'hàng đợi', definition: 'cấu trúc dữ liệu hoạt động theo nguyên tắc vào trước ra trước', distractors: ['vào sau ra trước', 'cây nhị phân', 'bảng băm'] }, { term: 'tìm kiếm nhị phân', definition: 'thuật toán tìm kiếm hiệu quả trên dãy đã được sắp xếp', distractors: ['thuật toán chỉ dùng cho đồ thị', 'thuật toán mã hóa', 'thuật toán nén'] }, { term: 'độ phức tạp O(n)', definition: 'thời gian xử lý tăng tuyến tính theo kích thước đầu vào', distractors: ['thời gian hằng số', 'thời gian logarit', 'không phụ thuộc đầu vào'] }, { term: 'danh sách liên kết', definition: 'cấu trúc gồm các nút liên kết với nhau qua tham chiếu', distractors: ['một mảng cố định', 'một giao thức', 'một hệ điều hành'] },
  ] },
  { code: 'CLS007', topic: 'Hệ điều hành', facts: [
    { term: 'tiến trình', definition: 'một chương trình đang được thực thi', distractors: ['một tệp văn bản', 'một thiết bị nhập', 'một địa chỉ mạng'] }, { term: 'luồng', definition: 'đơn vị thực thi nhỏ hơn thuộc một tiến trình', distractors: ['một ổ đĩa', 'một giao thức', 'một kiểu dữ liệu'] }, { term: 'lập lịch CPU', definition: 'cơ chế chọn tiến trình hoặc luồng được cấp CPU', distractors: ['cơ chế vẽ giao diện', 'cơ chế mã hóa', 'cơ chế sao lưu'] }, { term: 'bế tắc', definition: 'trạng thái các tiến trình chờ tài nguyên lẫn nhau và không thể tiếp tục', distractors: ['trạng thái hoàn thành', 'một loại bộ nhớ', 'một giao thức'] }, { term: 'bộ nhớ ảo', definition: 'kỹ thuật dùng lưu trữ thứ cấp để mở rộng không gian địa chỉ logic', distractors: ['một loại màn hình', 'một trình biên dịch', 'một hệ quản trị CSDL'] },
  ] },
  { code: 'CLS008', topic: 'Mạng máy tính', facts: [
    { term: 'địa chỉ IP', definition: 'địa chỉ logic định danh thiết bị trong mạng IP', distractors: ['địa chỉ vật lý MAC', 'tên miền', 'mật khẩu'] }, { term: 'DNS', definition: 'dịch tên miền thành địa chỉ IP', distractors: ['mã hóa tệp', 'cấp phát CPU', 'sắp xếp dữ liệu'] }, { term: 'switch', definition: 'thiết bị chuyển tiếp khung dữ liệu trong mạng LAN dựa trên địa chỉ MAC', distractors: ['thiết bị biên dịch mã', 'hệ điều hành', 'trình duyệt'] }, { term: 'TCP', definition: 'giao thức hướng kết nối, tin cậy và có kiểm soát luồng', distractors: ['giao thức không kết nối', 'ngôn ngữ đánh dấu', 'hệ cơ sở dữ liệu'] }, { term: 'router', definition: 'thiết bị định tuyến gói tin giữa các mạng khác nhau', distractors: ['thiết bị nhập liệu', 'một loại tệp', 'một ngôn ngữ'] },
  ] },
  { code: 'CLS009', topic: 'Phân tích và thiết kế hệ thống', facts: [
    { term: 'use case', definition: 'mô tả tương tác giữa tác nhân và hệ thống để đạt mục tiêu', distractors: ['một bảng cơ sở dữ liệu', 'một thuật toán sắp xếp', 'một giao thức'] }, { term: 'yêu cầu chức năng', definition: 'mô tả chức năng mà hệ thống phải cung cấp', distractors: ['màu giao diện', 'cấu hình máy tính', 'tên miền'] }, { term: 'ERD', definition: 'sơ đồ mô tả thực thể, thuộc tính và mối quan hệ dữ liệu', distractors: ['sơ đồ luồng mạng', 'mã nguồn', 'bảng điểm'] }, { term: 'DFD', definition: 'sơ đồ biểu diễn luồng dữ liệu giữa tiến trình, kho dữ liệu và tác nhân', distractors: ['sơ đồ lớp CSS', 'lịch CPU', 'biểu đồ cột'] }, { term: 'yêu cầu phi chức năng', definition: 'mô tả các ràng buộc chất lượng như hiệu năng, bảo mật và khả dụng', distractors: ['một chức năng đăng nhập', 'một bảng dữ liệu', 'một thuật toán'] },
  ] },
  { code: 'CLS010', topic: 'Xây dựng ứng dụng di động', facts: [
    { term: 'vòng đời Activity', definition: 'chuỗi trạng thái của màn hình ứng dụng Android từ tạo đến hủy', distractors: ['một giao thức mạng', 'một bảng dữ liệu', 'một thuật toán'] }, { term: 'layout', definition: 'cấu trúc bố trí các thành phần giao diện trên màn hình', distractors: ['hệ quản trị CSDL', 'một giao thức', 'một kiểu lỗi'] }, { term: 'permission', definition: 'quyền ứng dụng phải được cấp để truy cập tài nguyên nhạy cảm của thiết bị', distractors: ['một loại cơ sở dữ liệu', 'một ngôn ngữ đánh dấu', 'một thuật toán'] }, { term: 'local storage', definition: 'cơ chế lưu dữ liệu cục bộ trên thiết bị', distractors: ['một máy chủ DNS', 'một lịch CPU', 'một loại màn hình'] }, { term: 'responsive UI', definition: 'giao diện thích ứng hợp lý với kích thước và hướng màn hình khác nhau', distractors: ['giao diện chỉ chạy offline', 'giao diện không có sự kiện', 'giao diện chỉ có văn bản'] },
  ] },
  { code: 'CLS001', topic: 'Academic Trust và đánh giá trực tuyến', facts: [
    { term: 'phiên bản câu hỏi', definition: 'bản nội dung bất biến dùng để bảo toàn lịch sử đề thi', distractors: ['một tài khoản người dùng', 'một loại trình duyệt', 'một địa chỉ IP'] }, { term: 'ExamInstance', definition: 'đề thi riêng được tạo cho một sinh viên', distractors: ['một lớp học', 'một thiết bị mạng', 'một loại tệp'] }, { term: 'randomization', definition: 'cơ chế xáo trộn câu hỏi hoặc đáp án theo từng sinh viên', distractors: ['xóa dữ liệu', 'mã hóa mật khẩu', 'sao lưu tệp'] }, { term: 'tín hiệu toàn vẹn', definition: 'sự kiện được ghi nhận để giảng viên xem xét, không tự kết luận gian lận', distractors: ['điểm thi cuối cùng', 'mật khẩu', 'một loại câu hỏi'] }, { term: 'điểm chuẩn hóa', definition: 'điểm quy đổi từ điểm thô về thang điểm 10', distractors: ['số lần đăng nhập', 'thời lượng mạng', 'mã lớp học'] },
  ] },
];

async function main() {
  try {
  const lecturer = await prisma.user.findUnique({ where: { email: 'lecturer01@tdtutdtu.edu.vn' } });
  if (!lecturer) throw new Error('Không tìm thấy lecturer01; hãy chạy seed lớp học trước.');
  let total = 0;
  for (const bank of banks) {
    const course = await prisma.course.findUnique({ where: { code: bank.code } });
    if (!course) throw new Error(`Không tìm thấy khóa học ${bank.code}.`);
    let existingCount = await prisma.question.count({ where: { courseId: course.id } });
    const topicCode = `${bank.code}-QUESTION-BANK`;
    const topic = await prisma.topic.upsert({ where: { courseId_code: { courseId: course.id, code: topicCode } }, update: { name: bank.topic }, create: { courseId: course.id, code: topicCode, name: bank.topic } });
    await prisma.courseTopic.upsert({ where: { courseId_topicId: { courseId: course.id, topicId: topic.id } }, update: {}, create: { courseId: course.id, topicId: topic.id } });
    for (const [index, fact] of bank.facts.entries()) {
      const questionTypes = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'FILL_IN_BLANK', 'MULTI_SELECT', 'ESSAY', 'MATCHING', 'ORDERING', 'FIND_ERROR', 'MULTIPLE_CHOICE'] as const;
      const variants = Array.from({ length: 20 }, (_, variantIndex) => {
        const type = questionTypes[variantIndex % questionTypes.length];
        const promptTemplates = [
          `${fact.term}: ${fact.definition}.`,
          `Hãy giải thích hoặc áp dụng khái niệm ${fact.term}.`,
          `Mô tả nào phù hợp nhất với ${fact.term}?`,
          `Điền khái niệm còn thiếu: ${fact.definition}.`,
          `Chọn các nhận định phù hợp về ${fact.term}.`,
          `Phân tích vai trò của ${fact.term} trong bối cảnh môn học.`,
          `Ghép ${fact.term} với mô tả chính xác của nó.`,
          `Sắp xếp các bước hợp lý khi vận dụng ${fact.term}.`,
          `Tìm lỗi trong nhận định về ${fact.term}: ${fact.distractors[0]}.`,
          `Tình huống nào cần sử dụng kiến thức về ${fact.term}?`,
        ];
        return {
          type,
          content: `[${bank.code}] Câu ${index * 20 + variantIndex + 1}: ${promptTemplates[variantIndex % promptTemplates.length]}`,
          options: { A: fact.definition, B: fact.distractors[0], C: fact.distractors[1], D: fact.distractors[2] },
          answer: { answer: 'A', expected: fact.definition },
        };
      });
      for (const [variantIndex, item] of variants.entries()) {
        const existing = await prisma.question.findFirst({ where: { courseId: course.id, content: item.content } });
        if (existingCount >= 100 && !existing) continue;
        const question = existing ?? await prisma.question.create({ data: { courseId: course.id, creatorId: lecturer.id, type: item.type, content: item.content, options: item.options, correctAnswer: item.answer, explanation: `${fact.term}: ${fact.definition}.`, difficulty: 1 + ((index + variantIndex) % 5), points: 1 + (variantIndex % 2), defaultPoints: 1 + (variantIndex % 2), status: QuestionLifecycleStatus.PUBLISHED, latestVersionNo: 1, isReusable: true } });
        await prisma.questionVersion.upsert({ where: { questionId_versionNo: { questionId: question.id, versionNo: 1 } }, update: {}, create: { questionId: question.id, versionNo: 1, stem: item.content, payload: item.options, answerKey: item.answer, explanation: `${fact.term}: ${fact.definition}.`, difficulty: 1 + ((index + variantIndex) % 5), points: 1 + (variantIndex % 2), metadata: { topic: bank.topic, seededQuestionBank: true }, createdBy: lecturer.id } });
        await prisma.questionCourseScope.upsert({ where: { questionId_courseId: { questionId: question.id, courseId: course.id } }, update: {}, create: { questionId: question.id, courseId: course.id } });
        await prisma.questionTopic.upsert({ where: { questionId_topicId: { questionId: question.id, topicId: topic.id } }, update: { weight: 1 }, create: { questionId: question.id, topicId: topic.id, weight: 1 } });
        if (!existing) existingCount += 1;
        total += 1;
      }
    }
    // Older demo questions may predate course scopes; backfill the scope so
    // they appear in the course-specific question bank as well.
    const allCourseQuestions = await prisma.question.findMany({ where: { courseId: course.id }, select: { id: true } });
    await prisma.questionCourseScope.createMany({ data: allCourseQuestions.map((question) => ({ questionId: question.id, courseId: course.id })), skipDuplicates: true });
  }
  console.log(`Đã đảm bảo ${total} câu hỏi chuyên môn cho ${banks.length} lớp.`);
  } finally {
    await prisma.$disconnect();
  }
}

export { main };

if (process.argv[1] && process.argv[1].includes('seed-course-question-banks.ts')) {
  main().catch((error) => { console.error(error); process.exitCode = 1; });
}
