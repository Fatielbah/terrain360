package Pfe.T360.service;

import Pfe.T360.dto.IAResponse;

public interface IAService {
    IAResponse callAI(String prompt);
}
