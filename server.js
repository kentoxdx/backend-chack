const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'database.txt');

app.use(cors());
app.use(express.json());

// Helper function สำหรับอ่านข้อมูลจากไฟล์ database.txt
function readDatabase() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            return {};
        }
        const data = fs.readFileSync(DB_FILE, 'utf8');
        const lines = data.split('\n');
        const students = {};
        
        lines.forEach(line => {
            if (line.trim()) {
                const [code, status] = line.split(':');
                if (code && status) {
                    students[code.trim()] = status.trim();
                }
            }
        });
        return students;
    } catch (err) {
        console.error("เกิดข้อผิดพลาดในการอ่านไฟล์:", err);
        return {};
    }
}

// Helper function สำหรับเขียนข้อมูลกลับลงไปในไฟล์ database.txt
function writeDatabase(students) {
    const lines = Object.entries(students).map(([code, status]) => `${code}:${status}`);
    fs.writeFileSync(DB_FILE, lines.join('\n'), 'utf8');
}

// API สำหรับดึงรายชื่อ
app.get('/api/students', (req, res) => {
    const students = readDatabase();
    res.json(students);
});

// API สำหรับบันทึกการเช็คชื่อ
app.post('/api/checkin', (req, res) => {
    const { student_code } = req.body;
    
    if (!student_code) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกรหัสนักศึกษา' });
    }

    const students = readDatabase();

    // 1. ตรวจสอบว่ามีรหัสนี้อยู่ในระบบไหม
    if (!students[student_code]) {
        return res.status(404).json({ success: false, message: 'ไม่พบรหัสนักศึกษานี้ในระบบโปรเจกต์' });
    }

    const currentStatus = students[student_code];

    // 2. ตรวจสอบความปลอดภัย: ถ้ามีคำว่า (เช็คแล้ว) แปลว่าเช็คชื่อไปแล้ว ห้ามซ้ำ!
    if (currentStatus.includes('(เช็คแล้ว)')) {
        return res.status(400).json({ success: false, message: 'รหัสนี้ได้เช็คชื่อไปเรียบร้อยแล้ว!' });
    }

    // 3. หน้าเว็บโชว์อะไร: ดึงค่าเดิมในไฟล์ (เช่น none หรือ ชื่อเพื่อน) ไปโชว์ตรงๆ เลย ไม่ต้องแยกแยะแฝงคำอื่น!
    const displayName = currentStatus;

    // 4. ในไฟล์เซฟยังไง: เอาค่าเดิมในไฟล์มาต่อท้ายด้วยคำว่า (เช็คแล้ว) ตามใจสั่งเลยครับ
    students[student_code] = `${currentStatus} (เช็คแล้ว)`;
    
    // บันทึกกลับลงไฟล์ database.txt
    writeDatabase(students);

    res.json({ 
        success: true, 
        message: 'บันทึกเวลาเรียนเรียบร้อย',
        student_code: student_code,
        student_name: displayName // ส่งค่าเดิมๆ ไปโชว์บน Pop-up หน้าเว็บเลย 🌟
    });
});

app.listen(PORT, () => {
    console.log(`🚀 เซิร์ฟเวอร์หลังบ้านรันแล้วที่ http://localhost:${PORT}`);
});