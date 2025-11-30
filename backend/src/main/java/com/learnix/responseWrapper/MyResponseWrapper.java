package com.learnix.responseWrapper;

import org.springframework.stereotype.Component;

import lombok.Data;

@Component
@Data
public class MyResponseWrapper {

	private String message;
	private Object data;
}
