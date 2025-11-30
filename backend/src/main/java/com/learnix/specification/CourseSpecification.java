package com.learnix.specification;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import com.learnix.models.Course;

/**
 * Specification utilities for dynamic course searching/filtering/sorting.
 */
public class CourseSpecification {

    private CourseSpecification() {
    }

    public static Specification<Course> keywordLike(String keyword) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(keyword)) {
                return null;
            }
            String lowered = "%" + keyword.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("title")), lowered),
                    cb.like(cb.lower(root.get("description")), lowered),
                    cb.like(cb.lower(root.get("category")), lowered));
        };
    }

    public static Specification<Course> hasCategory(String category) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(category)) {
                return null;
            }
            return cb.equal(cb.lower(root.get("category")), category.trim().toLowerCase());
        };
    }

    public static Specification<Course> sortBy(String sortField, String sortDirection) {
        return (root, query, cb) -> {
            String field = StringUtils.hasText(sortField) ? sortField.toLowerCase() : "createdat";
            var path = switch (field) {
                case "title" -> root.get("title");
                case "category" -> root.get("category");
                case "price" -> root.get("price");
                case "createdat" -> root.get("createdAt");
                default -> root.get("createdAt");
            };

            if ("asc".equalsIgnoreCase(sortDirection)) {
                query.orderBy(cb.asc(path));
            } else {
                query.orderBy(cb.desc(path));
            }
            return null;
        };
    }
}

