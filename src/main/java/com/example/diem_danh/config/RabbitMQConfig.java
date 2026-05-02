package com.example.diem_danh.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${app.rabbitmq.exchange.notification}")
    private String notificationExchange;

    @Value("${app.rabbitmq.exchange.attendance}")
    private String attendanceExchange;

    @Value("${app.rabbitmq.queue.notification}")
    private String notificationQueue;

    @Value("${app.rabbitmq.queue.attendance}")
    private String attendanceQueue;

    @Value("${app.rabbitmq.routing.notification}")
    private String notificationRoutingKey;

    @Value("${app.rabbitmq.routing.attendance}")
    private String attendanceRoutingKey;

    @Bean
    public DirectExchange notificationExchange() {
        return ExchangeBuilder.directExchange(notificationExchange).durable(true).build();
    }

    @Bean
    public DirectExchange attendanceExchange() {
        return ExchangeBuilder.directExchange(attendanceExchange).durable(true).build();
    }

    @Bean
    public Queue notificationQueue() {
        return QueueBuilder.durable(notificationQueue)
                .withArgument("x-dead-letter-exchange", "dlx.exchange")
                .withArgument("x-dead-letter-routing-key", "dlx.notification")
                .build();
    }

    @Bean
    public Queue attendanceQueue() {
        return QueueBuilder.durable(attendanceQueue)
                .withArgument("x-dead-letter-exchange", "dlx.exchange")
                .withArgument("x-dead-letter-routing-key", "dlx.attendance")
                .build();
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return ExchangeBuilder.directExchange("dlx.exchange").durable(true).build();
    }

    @Bean
    public Queue dlqNotification() {
        return QueueBuilder.durable("dlq.notification").build();
    }

    @Bean
    public Queue dlqAttendance() {
        return QueueBuilder.durable("dlq.attendance").build();
    }

    @Bean
    public Binding notificationBinding() {
        return BindingBuilder.bind(notificationQueue()).to(notificationExchange()).with(notificationRoutingKey);
    }

    @Bean
    public Binding attendanceBinding() {
        return BindingBuilder.bind(attendanceQueue()).to(attendanceExchange()).with(attendanceRoutingKey);
    }

    @Bean
    public Binding dlqNotificationBinding() {
        return BindingBuilder.bind(dlqNotification()).to(deadLetterExchange()).with("dlx.notification");
    }

    @Bean
    public Binding dlqAttendanceBinding() {
        return BindingBuilder.bind(dlqAttendance()).to(deadLetterExchange()).with("dlx.attendance");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jsonMessageConverter());
        factory.setConcurrentConsumers(3);
        factory.setMaxConcurrentConsumers(10);
        factory.setDefaultRequeueRejected(false); // gửi về DLQ khi lỗi
        return factory;
    }
}