package com.uumis.repository;



import com.uumis.entity.PageContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PageContentRepository extends JpaRepository<PageContent, String> {
    // JpaRepository gives us findById() and save() automatically!
}