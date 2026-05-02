package com.example.diem_danh.config;

import org.neo4j.driver.Driver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.neo4j.core.DatabaseSelectionProvider;
import org.springframework.data.neo4j.core.transaction.Neo4jTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableTransactionManagement
public class Neo4jConfig {

    /**
     * Explicitly declare the synchronous Neo4jTransactionManager as @Primary
     * to resolve ambiguity with ReactiveTransactionManager auto-configured
     * by spring-boot-starter-data-neo4j.
     *
     * Without this, @Transactional in service layer throws:
     * "No qualifying bean of type 'TransactionManager' available:
     *  expected single matching bean but found 2:
     *  transactionManager, reactiveTransactionManager"
     */
    @Bean
    @Primary
    public Neo4jTransactionManager transactionManager(Driver driver,
                                                      DatabaseSelectionProvider databaseSelectionProvider) {
        return new Neo4jTransactionManager(driver, databaseSelectionProvider);
    }
}