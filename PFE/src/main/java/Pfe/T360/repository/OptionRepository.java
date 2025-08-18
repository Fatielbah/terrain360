package Pfe.T360.repository;

import Pfe.T360.entity.Option;
import Pfe.T360.entity.Sondage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OptionRepository extends JpaRepository<Option, Long> {
    List<Option> findBySondage(Sondage sondage);
}
