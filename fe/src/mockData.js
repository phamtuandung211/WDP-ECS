// Mock data for static UI
export const doctors = [
  {
    id: "1",
    fullName: "Dr. Nguyễn Văn A",
    specializations: ["Khám tổng quát", "Phẫu thuật đục thủy tinh thể"],
    experienceYears: 12,
    bio: "Giáo sư nhãn khoa với hơn 12 năm kinh nghiệm trong điều trị các bệnh về mắt.",
  },
  {
    id: "2",
    fullName: "Dr. Trần Thị B",
    specializations: ["Khám trẻ em", "Bệnh lý võng mạc"],
    experienceYears: 8,
    bio: "Chuyên gia nhãn khoa nhi, luôn tận tâm chăm sóc và tư vấn cho các bệnh nhân nhỏ tuổi.",
  },
  {
    id: "3",
    fullName: "Dr. Lê Văn C",
    specializations: ["Khám tổng quát", "Thẩm mỹ mắt"],
    experienceYears: 5,
    bio: "Bác sĩ nhãn khoa trẻ trung, chuyên về phẫu thuật thẩm mỹ và điều trị khúc xạ.",
  },
  {
    id: "4",
    fullName: "Dr. Phạm Thị D",
    specializations: ["Khám lão khoa", "Glaucoma"],
    experienceYears: 15,
    bio: "Chuyên gia lão khoa với kinh nghiệm xử lý các trường hợp glaucoma phức tạp.",
  },
];

export const services = [
  {
    id: "1",
    name: "Khám tổng quát",
    description: "Kiểm tra thị lực và sức khỏe tổng quát của mắt.",
    price: 200000,
  },
  {
    id: "2",
    name: "Phẫu thuật đục thủy tinh thể",
    description: "Can thiệp phẫu thuật để thay thủy tinh thể bị mờ.",
    price: 5000000,
  },
  {
    id: "3",
    name: "Khám trẻ em",
    description: "Dịch vụ khám chuyên biệt cho trẻ em và thanh thiếu niên.",
    price: 250000,
  },
  {
    id: "4",
    name: "Điều trị glaucoma",
    description: "Theo dõi và điều trị bệnh tăng nhãn áp.",
    price: 1500000,
  },
];

export const blogs = [
  {
    id: "1",
    title: "5 cách bảo vệ mắt khi làm việc máy tính",
    content:
      "Máy tính và điện thoại là nguyên nhân gây mỏi mắt. Bài viết này giới thiệu những cách đơn giản để giảm căng thẳng mắt khi bạn phải làm việc nhiều giờ trước màn hình...",
  },
  {
    id: "2",
    title: "Khi nào cần đi khám mắt định kỳ?",
    content:
      "Khám mắt định kỳ giúp phát hiện sớm các bệnh lý như cận thị, viễn thị, đục thủy tinh thể và các bệnh lý võng mạc. Hãy đọc để biết lịch khám phù hợp với độ tuổi của bạn...",
  },
  {
    id: "3",
    title: "Thực phẩm tốt cho sức khỏe mắt",
    content:
      "Một chế độ ăn giàu vitamin A, C và omega-3 có thể giúp giảm nguy cơ thoái hóa điểm vàng. Tìm hiểu những thực phẩm nên thêm vào khẩu phần ăn hàng ngày...",
  },
];

export const appointments = [
  {
    id: "a1",
    serviceName: "Khám tổng quát",
    date: "2026-04-01",
    time: "09:00",
    status: "Pending",
  },
  {
    id: "a2",
    serviceName: "Khám trẻ em",
    date: "2026-04-03",
    time: "11:30",
    status: "Confirmed",
  },
  {
    id: "a3",
    serviceName: "Phẫu thuật đục thủy tinh thể",
    date: "2026-04-10",
    time: "14:00",
    status: "Completed",
  },
];
