package Pfe.T360.service;


import Pfe.T360.entity.Rappel;

import java.util.Optional;

public interface RappelService {

    Rappel createRappel(Long evenementId, Rappel rappel);

    Optional<Rappel> getRappelByEvenementId(Long evenementId);

    boolean envoyerRappel(Long evenementId);
    Rappel updateRappel(Long rappelId, Rappel updatedRappel);

}
