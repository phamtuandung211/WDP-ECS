import { useNavigate } from "react-router-dom";



const DoctorCard = ({ doctor, onBookClick }) => {

    const navigate = useNavigate();

    return (
        <div
          onClick={() => navigate(`/doctors/${doctor._id}`)}
          className="bg-white rounded-2xl shadow hover:shadow-xl transition p-6 text-center cursor-pointer"
        >

            {/* Avatar circle */}
            <div className="w-48 h-48 mx-auto rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                <img
                    src={doctor?.avatar || "https://www.shutterstock.com/image-photo/healthcare-medical-staff-concept-portrait-600nw-2281024823.jpg"}
                    alt={doctor?.fullName || "Doctor avatar"}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Name */}
            <h4 className="mt-6 font-semibold text-lg uppercase">
                {doctor?.fullName || "N/A"}
            </h4>

            {/* Specialization */}
            <p className="text-blue-600 text-sm mt-2">
                {doctor?.specializations?.map((spec) => spec.name).join(", ") || "Chuyên khoa"}
            </p>

            {/* Experience year */}
            <p className="text-blue-600 text-sm mt-2">
                <span>Năm kinh nghiệm:</span> {doctor?.experienceYears ? `${doctor.experienceYears} năm` : "Kinh nghiệm chưa cập nhật"}
            </p>

            { /*Gender*/}
            <p className="text-blue-600 text-sm mt-2">
                <span>Giới tính:</span> {doctor?.gender === "MALE" ? "Nam" : doctor?.gender === "FEMALE" ? "Nữ" : "Chưa cập nhật"}
            </p>

            {/* Rating */}
            <div className="flex justify-center mt-3 text-yellow-400">
                ⭐⭐⭐⭐⭐
            </div>



            {/* Button */}
            <button
                type="button"
                onClick={() => {
                    if (typeof onBookClick === "function") {
                        onBookClick(doctor);
                    }
                }}
                className="mt-4 border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-600 hover:text-white transition"
            >
                Đặt lịch khám
            </button>
        </div>
    );
};

export default DoctorCard;