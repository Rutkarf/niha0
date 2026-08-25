package com.sasurd.niha0.rag;

import java.util.List;

public record RagSearchResponse(
        String query,
        int totalChunks,
        String engine,
        List<RagHit> hits
) {}
