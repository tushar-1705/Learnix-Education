package com.learnix.config;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import com.learnix.models.Users;
import com.learnix.repositories.UserRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

	@Autowired
    private UserRepository userRepository;


    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Users u = userRepository.findByEmail(email);
        if(u == null){
            throw new UsernameNotFoundException("User not found with email: " + email);
        }
        return new CustomUserDetails(u);
    }
}
