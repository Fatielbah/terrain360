package Pfe.T360.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomTimeDto {
    private int hour;
    private int minute;

    @JsonCreator
    public CustomTimeDto(@JsonProperty("hour") int hour, @JsonProperty("minute") int minute) {
        this.hour = hour;
        this.minute = minute;
    }
}

