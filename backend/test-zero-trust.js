// Giả hacker tấn công 

const { prismaReadOnly } = require('./src/prismaClient');

async function hackDatabase() {
    console.log("==========================================");
    console.log("🕵️ HACKER ĐANG BẮT ĐẦU TẤN CÔNG...");
    console.log("Mục tiêu: Xóa sản phẩm có ID là 1");
    console.log("==========================================");

    try {

        await prismaReadOnly.product.delete({
            where: { id: 1 }
        });
        
        console.log(" Hacker đã xóa được dữ liệu.");
    } catch (error) {
        console.log("Kiến trúc Zero Trust đã hoạt động.");
        console.log("Hệ thống phân quyền của PostgreSQL đã chặn đứng lệnh xóa!");
        console.log("Chi tiết lỗi trả về:");
        console.log(error.message);
    }
}

hackDatabase();