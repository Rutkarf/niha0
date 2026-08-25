package com.sasurd.niha0.security;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.time.Instant;

@Service
public class TotpService {

    private static final String BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TIME_STEP_SECONDS = 30;
    private static final int CODE_DIGITS = 6;

    public String generateSecret(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(BASE32_CHARS.charAt(SECURE_RANDOM.nextInt(BASE32_CHARS.length())));
        }
        return sb.toString();
    }

    public String buildOtpAuthUri(String email, String secret) {
        return "otpauth://totp/NIHAO:" + email + "?secret=" + secret + "&issuer=NIHAO";
    }

    public boolean verify(String secret, String code) {
        if (secret == null || secret.isBlank() || code == null || !code.matches("\\d{6}")) {
            return false;
        }
        long counter = Instant.now().getEpochSecond() / TIME_STEP_SECONDS;
        for (long offset = -1; offset <= 1; offset++) {
            if (generateCode(secret, counter + offset).equals(code)) {
                return true;
            }
        }
        return false;
    }

    public String currentCode(String secret) {
        long counter = Instant.now().getEpochSecond() / TIME_STEP_SECONDS;
        return generateCode(secret, counter);
    }

    private String generateCode(String secret, long counter) {
        byte[] key = decodeBase32(secret);
        byte[] data = ByteBuffer.allocate(8).putLong(counter).array();
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);
            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);
            int otp = binary % (int) Math.pow(10, CODE_DIGITS);
            return String.format("%0" + CODE_DIGITS + "d", otp);
        } catch (Exception e) {
            return "";
        }
    }

    private static byte[] decodeBase32(String input) {
        String normalized = input.trim().toUpperCase().replace("=", "");
        ByteBuffer buffer = ByteBuffer.allocate(normalized.length() * 5 / 8 + 8);
        int bits = 0;
        int value = 0;
        for (char c : normalized.toCharArray()) {
            int idx = BASE32_CHARS.indexOf(c);
            if (idx < 0) {
                continue;
            }
            value = (value << 5) | idx;
            bits += 5;
            if (bits >= 8) {
                buffer.put((byte) (value >> (bits - 8)));
                bits -= 8;
            }
        }
        byte[] result = new byte[buffer.position()];
        buffer.flip();
        buffer.get(result);
        return result;
    }
}
