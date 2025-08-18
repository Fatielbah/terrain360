package Pfe.T360.service;

import java.util.function.Supplier;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.entity.CustomUtilisateurDetails;



@RequiredArgsConstructor
@Service
public class JpaUtilisateurDetailsService implements UserDetailsService{

    @Autowired
    final UtilisateurRepository utilisateurRepository;
    @Override

    public CustomUtilisateurDetails loadUserByUsername(String nomDeUtilisateur) {
        Supplier<UsernameNotFoundException> s = () -> new UsernameNotFoundException("Problem during authentication!");

        Utilisateur utilisateur = utilisateurRepository.findByNomDeUtilisateur(nomDeUtilisateur)

                .orElseThrow(s);

        // Use the fromUtilisateur method here
        return CustomUtilisateurDetails.fromUtilisateur(utilisateur);
    }


}
