package com.learnix.specification;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import com.learnix.models.Users;

/**
 * Reusable JPA Specifications for {@link Users} entity to support dynamic
 * search, filter and sorting requirements across admin and teacher services.
 */
public class UserSpecification {

    private UserSpecification() {
    }

    public static Specification<Users> hasRole(String role) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(role)) {
                return null;
            }
            return cb.equal(cb.lower(root.get("role")), role.toLowerCase());
        };
    }

    public static Specification<Users> keywordLike(String keyword) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(keyword)) {
                return null;
            }
            String lowered = "%" + keyword.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), lowered),
                    cb.like(cb.lower(root.get("email")), lowered),
                    cb.like(cb.lower(root.get("phoneNumber")), lowered));
        };
    }

    public static Specification<Users> isApproved(Boolean approved) {
        return (root, query, cb) -> {
            if (approved == null) {
                return null;
            }
            if (Boolean.TRUE.equals(approved)) {
                return cb.isTrue(root.get("isApproved"));
            }
            return cb.or(cb.isFalse(root.get("isApproved")), cb.isNull(root.get("isApproved")));
        };
    }

    public static Specification<Users> sortBy(String sortField, String sortDirection) {
        return (root, query, cb) -> {
            String field = StringUtils.hasText(sortField) ? sortField.toLowerCase() : "name";
            var path = switch (field) {
                case "email" -> root.get("email");
                case "phonenumber" -> root.get("phoneNumber");
                case "createdat" -> root.get("createdAt");
                default -> root.get("name");
            };

            if ("desc".equalsIgnoreCase(sortDirection)) {
                query.orderBy(cb.desc(path));
            } else {
                query.orderBy(cb.asc(path));
            }
            return null;
        };
    }
}

