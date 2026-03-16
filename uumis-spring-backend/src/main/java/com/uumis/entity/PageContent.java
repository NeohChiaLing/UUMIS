package com.uumis.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "page_content")
public class PageContent {

    @Id
    private String pageId; // This will be "home", "mission-vision", "fees", etc.

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String jsonData;

    public PageContent() {}
    public PageContent(String pageId, String jsonData) {
        this.pageId = pageId;
        this.jsonData = jsonData;
    }

    // Getters and Setters
    public String getPageId() { return pageId; }
    public void setPageId(String pageId) { this.pageId = pageId; }
    public String getJsonData() { return jsonData; }
    public void setJsonData(String jsonData) { this.jsonData = jsonData; }
}