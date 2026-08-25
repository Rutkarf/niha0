package com.sasurd.niha0.rag;

import java.util.UUID;

public record RagHit(
        UUID chunkId,
        UUID dataAssetId,
        String assetName,
        int chunkIndex,
        String excerpt,
        double score
) {}
