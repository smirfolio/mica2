package org.obiba.mica.core.repository;

import java.util.List;

import org.obiba.mica.core.domain.Person;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface PersonRepository extends MongoRepository<Person, String> {
  @Query(value = "{'studyMemberships.parentId' : ?0 }")
  List<Person> findByStudyMemberships(String studyId);

  @Query(value = "{'networkMemberships.parentId' : ?0 }")
  List<Person> findByNetworkMemberships(String networkId);

  Person findOneByEmail(String email);
}