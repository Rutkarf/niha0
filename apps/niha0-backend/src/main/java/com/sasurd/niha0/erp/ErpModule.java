package com.sasurd.niha0.erp;

public enum ErpModule {
    CMS, SCM, MRP, ETL, EDI;

    public static ErpModule fromPath(String path) {
        return ErpModule.valueOf(path.trim().toUpperCase());
    }
}
