import { BASE_URL } from "@/apis"
import type { ResetPasswordRequest } from "../interfaces"


// Tạo biến môi trường
const SEND_OTP = '/auth/send-otp-reset-password'
const RESET_PASSWORD = '/auth/reset-password'
// api lấy mã otp 
export const sendPhoneNumber = async (phoneNumber: string) => {
    const response = await BASE_URL.post(SEND_OTP, {
        phoneNumber: phoneNumber
    })
    return response.data
}

// api tạo tài khoản mới 
export const createPassword = async (value:ResetPasswordRequest) => {
    const response = await BASE_URL.post(RESET_PASSWORD,value)
    return response.data
}