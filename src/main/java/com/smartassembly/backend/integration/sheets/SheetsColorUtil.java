package com.smartassembly.backend.integration.sheets;

import com.google.api.services.sheets.v4.model.Color;

public final class SheetsColorUtil {
    private SheetsColorUtil() {}

    public static String toHex(Color color) {
        if (color == null) return null;
        int r = floatToByte(color.getRed());
        int g = floatToByte(color.getGreen());
        int b = floatToByte(color.getBlue());
        return String.format("#%02X%02X%02X", r, g, b);
    }

    private static int floatToByte(Float v) {
        if (v == null) return 255;
        float clamped = Math.max(0f, Math.min(1f, v));
        return Math.round(clamped * 255f);
    }
}

