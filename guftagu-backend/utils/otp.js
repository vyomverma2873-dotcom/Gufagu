/**
 * Generate a random 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate OTP format
 */
function isValidOTP(otp) {
  const regex = /^\d{6}$/;
  return regex.test(otp);
}

module.exports = {
  generateOTP,
  isValidOTP,
};
